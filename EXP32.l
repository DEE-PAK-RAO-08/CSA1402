%{
#include <stdio.h>

int positive = 0, negative = 0;
%}

%%
-[0-9]+              { printf("%s : Negative Number\n", yytext); negative++; }

[+]?[0-9]+           { printf("%s : Positive Number\n", yytext); positive++; }

[ \t\n]+             ;

.                    ;
%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter numbers (Press Ctrl+Z in Windows or Ctrl+D in Linux to stop):\n\n");
    yylex();

    printf("\nPositive Numbers = %d\n", positive);
    printf("Negative Numbers = %d\n", negative);

    return 0;
}