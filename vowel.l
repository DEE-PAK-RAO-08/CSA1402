%{
#include<stdio.h>
%}

%%
[aAeEiIoOuU]     { printf("%s is a Vowel\n", yytext); }
[a-zA-Z]         { printf("%s is a Consonant\n", yytext); }
\n               ;
%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter Character: ");
    yylex();
    return 0;
}