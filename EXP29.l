%{
#include<stdio.h>
%}

%%

"#include"[^\n]*      { printf("%s : Header File\n", yytext); }

"int"|"char"|"float"|"void"|"main"   { printf("%s : Keyword\n", yytext); }

[a-zA-Z_][a-zA-Z0-9_]*   { printf("%s : Identifier\n", yytext); }

[0-9]+   { printf("%s : Constant\n", yytext); }

"+"|"-"|"*"|"/"|"="   { printf("%s : Operator\n", yytext); }

";"|","|"("|")"|"{"|"}"   { printf("%s : Symbol\n", yytext); }

\".*\"   { printf("%s : String\n", yytext); }

[ \t\n]+   ;

.   ;

%%

int yywrap()
{
    return 1;
}

int main()
{
    FILE *fp;

    fp = fopen("sample.c","r");

    if(fp==NULL)
    {
        printf("File not found");
        return 0;
    }

    yyin = fp;
    yylex();

    fclose(fp);

    return 0;
}