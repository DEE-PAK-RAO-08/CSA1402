%{
#include<stdio.h>
%}

%%
hello      { printf("Hello Found\n"); }
world      { printf("World Found\n"); }
.|\n       ;
%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter Text: ");
    yylex();
    return 0;
}