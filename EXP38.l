%{
#include<stdio.h>
#include<string.h>

int max = 0;
char longest[100];
%}

%%

[A-Za-z]+ {
    if(strlen(yytext) > max)
    {
        max = strlen(yytext);
        strcpy(longest, yytext);
    }
}

[ \t\n]+ ;

. ;

%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter a sentence:\n");
    yylex();

    printf("\nLongest Word : %s", longest);
    printf("\nLength       : %d\n", max);

    return 0;
}