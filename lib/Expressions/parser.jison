%{
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

%x INITIAL

%%

// End of file match
<*><<EOF>>          return 'EOF';

<*>'('  return '(';
<*>')' return ')';

<*>{dec}  return 'Number';

<*>"true" return 'true';
<*>"false" return 'false';

<*>{name}  return 'StringLiteral';

<*>',' return ',';

<*>'"' return '"';

<*>'==' return '==';

<*>'@.' return '@.';

<*>"/*"(.|\r|\n)*?"*/" %{
    if (yytext.match(/\r|\n/) && parser.restricted) {
        parser.restricted = false;
        this.unput(yytext);
        return ";";
    }
%}

<*>"//".*($|\r|\n) %{
    if (yytext.match(/\r|\n/) && parser.restricted) {
        parser.restricted = false;
        this.unput(yytext);
        return ";";
    }
%}


// Skip whitespaces in other states
<*>\s+  /* skip whitespaces */

// All other matches are invalid
<*>.    return 'INVALID'

/lex

//%start file

%left '=='

%%

Input
  : EOF { return {} }
  | Expression EOF { return $$ }
  ;

Literal
   : '"' StringLiteral '"' { $$ = { type: 2, constant: Datatype.encode($2) } }
   | '"' '"' { $$ = { type: 2, constant: Datatype.encode("") } }
   | Number { $$ = { type: 2, constant: Datatype.encode(parseInt($1)) } }
   | true { $$ = { type: 2, constant: Datatype.encode(true) } }
   | false { $$ = { type: 2, constant: Datatype.encode(false) } }
   ;

Expression
  : Literal
  | Field
  | FunctionCall
  | ':' PlaceholderName
  | '@' SQLVariable
//  | Expression Operator Expression
  | Expression '==' Expression %{
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

DocPath
  : '@.' StringLiteral %{
    $$ = {
      type: 1,
      identifier: {
        document_path: {
          type: 1,
          value: $2
        }
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

string
  : QUOTE string_quoted QUOTE { $$ = $2; }
  ;

string_quoted
  : string_quoted_char { $$ = $1; }
  | string_quoted string_quoted_char { $$ = $1 + $2; }
  ;

string_quoted_char
  : HEX_ESCAPE   { $$ = parser.protobufCharUnescape($1); }
  | OCT_ESCAPE   { $$ = parser.protobufCharUnescape($1); }
  | CHAR_ESCAPE  { $$ = parser.protobufCharUnescape($1); }
  | NON_ESCAPED  { $$ = $1; }
  | NAME         { $$ = $1; }
  ;
