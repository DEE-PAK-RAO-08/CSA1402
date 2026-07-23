%{
#include<stdio.h>
%}

%%
(http|https):\/\/[a-zA-Z0-9._\/-]+    { printf("Valid URL\n"); }
.*                                    { printf("Invalid URL\n"); }
%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter URL: ");
    yylex();
    return 0;
}