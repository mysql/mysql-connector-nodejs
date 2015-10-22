%{
/*
 * Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */
var Datatype = require('./../Protocol/Datatype');
%}

%lex

name           ([A-Za-z_][A-Za-z_0-9]*)
name_with_dots ([A-Za-z_][A-Za-z_0-9\-\.]+)

float  (\d+(\.\d+)?([Ee][\+-]?\d+)?)
dec    ([1-9][0-9]*)
hex    (0[xX][A-Fa-f0-9]+)
oct    (0[0-7]+)
bool   ("true"|"false")

quote         (['"])
hex_escape    (\\[Xx][A-Fa-f0-9]{1,2})
oct_escape    (\\0?[0-7]{1,3})
char_escape   (\\[abfnrtv\\/'"])
non_escaped   ([^\0\n])

%{
parser.charUnescape = function (chr) {
  if (chr[0] !== "\\") {
    return chr;
  }

  chr = chr.substr(1);

  var quotes = {
    '"':  '"',
    '\'': '\''
  };

  if (quotes[chr]) {
    if (chr === parser.charUnescapeCurrentQuote) {
      return quotes[chr];
    } else {
      return '\\' + quotes[chr];
    }
  }

  var escapee = {
    '\\': '\\',
    '/':  '/',
    b:    '\b',
    f:    '\f',
    n:    '\n',
    r:    '\r',
    t:    '\t',
    v:    '\v'
  };

  if (escapee[chr]) {
    return escapee[chr];
  }

  chr = String.fromCharCode(chr);

  return chr;
};
%}

%x INITIAL
%x string_quoted_content
%x backtick

%%

// End of file match
<INITIAL><<EOF>>          return 'EOF';

<INITIAL>'(' return '(';
<INITIAL>')' return ')';

<INITIAL>{dec}  return 'Number';

<INITIAL>"true" return 'true';
<INITIAL>"false" return 'false';

<INITIAL>{name}  return 'StringLiteral';

<INITIAL>',' return ',';

<INITIAL>'||' return '||';

<INITIAL>'&&' return '&&';

<INITIAL>'==' return '==';

<INITIAL>'+' return '+';

<INITIAL>'-' return '-';

<INITIAL>'*' return '*';

<INITIAL>'/' return '/';

<INITIAL>'%' return '%';

<INITIAL>'!' return '!';

<INITIAL>'==' return '==';

<INITIAL>'$' return '$';

<INITIAL>'.' return '.';

<INITIAL>"/*"(.|\r|\n)*?"*/" %{
    if (yytext.match(/\r|\n/) && parser.restricted) {
        parser.restricted = false;
        this.unput(yytext);
        return ";";
    }
%}

<INITIAL>"//".*($|\r|\n) %{
    if (yytext.match(/\r|\n/) && parser.restricted) {
        parser.restricted = false;
        this.unput(yytext);
        return ";";
    }
%}

<INITIAL>{quote} this.begin('string_quoted_content'); parser.charUnescapeCurrentQuote = this.match; return 'QUOTE';
<string_quoted_content>\s+             return 'NON_ESCAPED';
<string_quoted_content>{hex_escape}    return 'HEX_ESCAPE';
<string_quoted_content>{oct_escape}    return 'OCT_ESCAPE';
<string_quoted_content>{char_escape}   return 'CHAR_ESCAPE';
<string_quoted_content>{quote}         if (parser.charUnescapeCurrentQuote === this.match) { this.popState(); return 'QUOTE'; } else { return 'NON_ESCAPED'; }
<string_quoted_content>{non_escaped}   return 'NON_ESCAPED';

<INITIAL>"`" this.begin('backtick'); return '`';
<backtick>\s+ return 'NON_ESCAPED';
<backtick>[^`]   return 'NON_ESCAPED';
<backtick>"`" this.popState(); return '`';

// Skip whitespaces in other states
<INITIAL>\s+  /* skip whitespaces */

// All other matches are invalid
<INITIAL>.    return 'INVALID'

/lex

//%start file

%left '||'
%left '&&'
%nonassoc '=='
%left '+' '-'
%left '*' '/' '%'
%right '!'

%%

Input
  : EOF { return {} }
  | Expression EOF { return $$ }
  ;

Literal
   : string { $$ = { type: 2, literal: Datatype.encodeScalar($1) } }
   | Number { $$ = { type: 2, literal: Datatype.encodeScalar(parseInt($1)) } }
   | true { $$ = { type: 2, literal: Datatype.encodeScalar(true) } }
   | false { $$ = { type: 2, literal: Datatype.encodeScalar(false) } }
   ;

Expression
  : Literal
  | FunctionCall
  | ':' PlaceholderName
  | '@' SQLVariable
  | column %{
    $$ = {
      type: 1,
      identifier: {
        name: $1
      }
    }
  }%
  | column '.' column %{
    $$ = {
      type: 1,
      identifier: {
        name: $3,
        table_name: $1
      }
    }
  }%
  | column '.' column '.' column %{
    $$ = {
      type: 1,
      identifier: {
        name: $5,
        table_name: $3,
        schema_name: $1
      }
    }
  }%
  | Expression BinaryOperator Expression %{
    $$ = {
      type: 5,
      operator: {
        name: $2,
        param: [ $1, $3 ]
      }
    }
  }%
  | DocPath
  | JSONExpression
  | '(' Expression ')' { $$ = $2; }
  ;

BinaryOperator
  : '||'
  | '&&'
  | '=='
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  ;

Field
  : ( StringLiteral '@.' )? StringLiteral ( '[' Index ']' )? ( '.' StringLiteral ( '[' Index ']' )? )*
  ;

FunctionCall
  : FunctionName '(' FunctionArgs ')' %{
    $$ = {
      type: 4,
      function_call: {
        name: $1
      }
    };
    if ($3) {
      $$.function_call.param = $3;
    }
  }%
  ;

FunctionName
  : StringLiteral  { $$ = { name: $1 } }
  | StringLiteral '.' StringLiteral  { $$ = { name: $2, schema_name: $1 } }
  ;

FunctionArgs
  : %empty { $$ = [] }
  | Expression { $$ = [ $1 ] }
  | FunctionArgs ',' Expression { $$ = $1; $$.push($3); }
  ;

DocPathElement
  : '.' StringLiteral { $$ = { type: 1, value: $2 } }
  ;

DocPathElements
  : DocPathElement { $$ = [ $1 ]; }
  | DocPathElements DocPathElement { $$ = $1; $$.push($2); }
  ;

DocPath
  : '$' DocPathElements %{
    $$ = {
      type: 1,
      identifier: {
        document_path: $2
      }
    }
  }%
  ;

JSONExpression
  : JSONDocument
  | '[' Expression ( ',' Expression )* ']'
  ;

JSONDocument
  : '{' StringLiteral ':' Expression ( ',' StringLiteral ':' Expression )* '}'
  ;

int
  : DEC
  | HEX
  | OCT
  ;

column
  : '`' column_quoted '`' { $$ = $2 }
  ;

column_quoted
  : NON_ESCAPED { $$ = $1; }
  | column_quoted NON_ESCAPED { $$ = $1 + $2; }
  ;

string
  : QUOTE string_quoted QUOTE { $$ = $2; }
  ;

string_quoted
  : string_quoted_char { $$ = $1; }
  | string_quoted string_quoted_char { $$ = $1 + $2; }
  ;

string_quoted_char
  : HEX_ESCAPE   { $$ = parser.charUnescape($1); }
  | OCT_ESCAPE   { $$ = parser.charUnescape($1); }
  | CHAR_ESCAPE  { $$ = parser.charUnescape($1); }
  | NON_ESCAPED  { $$ = $1; }
  | NAME         { $$ = $1; }
  ;
