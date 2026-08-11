%{
#include<stdio.h>

int chars = 0, words = 0, lines = 0;
%}

%%
[ \t]+            ;
\n                { lines++; }
[A-Za-z0-9_]+     { words++; chars += yyleng; }
.                 { chars++; }
%%

int yywrap()
{
    return 1;
}

int main()
{
    yyin = fopen("sample.c", "r");

    if (yyin == NULL)
    {
        printf("File not found\n");
        return 0;
    }

    yylex();

    printf("Characters = %d\n", chars);
    printf("Words = %d\n", words);
    printf("Lines = %d\n", lines + 1);

    fclose(yyin);
    return 0;
}