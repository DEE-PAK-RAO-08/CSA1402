%{
#include<stdio.h>
#include<string.h>

char word[20];
int count=0;
%}

%%

[a-zA-Z]+ { if(strcmp(yytext,word)==0) count++; }

[ \t\n]+ ;

. ;

%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter word to search: ");
    scanf("%s",word);

    printf("Enter sentence:\n");

    yylex();

    printf("\nFrequency of '%s' = %d\n",word,count);

    return 0;
}