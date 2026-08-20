%{
#include<stdio.h>
%}

%%
http:\/\/[A-Za-z0-9._/-]+      { printf("Valid URL\n"); }
https:\/\/[A-Za-z0-9._/-]+     { printf("Valid URL\n"); }
ftp:\/\/[A-Za-z0-9._/-]+       { printf("Valid URL\n"); }

[A-Za-z0-9:\/._-]+             { printf("Invalid URL\n"); }

[ \t\n]+                       ;

.                              ;
%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter URL:\n");
    yylex();
    return 0;
}