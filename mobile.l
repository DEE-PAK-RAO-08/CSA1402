%{
#include<stdio.h>
%}

%%
[0-9]{10}      { printf("Valid Mobile Number\n"); }
.*             { printf("Invalid Mobile Number\n"); }
%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter Mobile Number: ");
    yylex();
    return 0;
}