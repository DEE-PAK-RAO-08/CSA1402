%{
#include<stdio.h>
%}

%%

[0-9]      { printf("%s : Digit\n", yytext); }

[A-Za-z]+  { printf("%s : Not a Digit\n", yytext); }

.          { printf("%s : Not a Digit\n", yytext); }

%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter input:\n");
    yylex();
    return 0;
}