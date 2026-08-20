%{
#include <stdio.h>
%}

%%
auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while    { printf("%s : Keyword\n", yytext); }

[a-zA-Z_][a-zA-Z0-9_]*    { printf("%s : Identifier\n", yytext); }

[0-9]+    ;

[ \t\n]+    ;

.    ;
%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter C program:\n");
    yylex();
    return 0;
}