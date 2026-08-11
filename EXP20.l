%{
#include<stdio.h>
%}

%%
[0-9]+(\.[0-9]+)?    { printf("%s\n", yytext); }
.|\n                 ;
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

    printf("Constants in the program are:\n");
    yylex();

    fclose(yyin);
    return 0;
}