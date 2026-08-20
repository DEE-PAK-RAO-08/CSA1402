%{
#include<stdio.h>
#include<string.h>

char oldword[50], newword[50];
FILE *fp;
%}

%%

[A-Za-z]+ {
    if(strcmp(yytext, oldword) == 0)
        fprintf(fp,"%s",newword);
    else
        fprintf(fp,"%s",yytext);
}

[ \t\n]+ {
    fprintf(fp,"%s",yytext);
}

. {
    fprintf(fp,"%s",yytext);
}

%%

int yywrap()
{
    return 1;
}

int main()
{
    FILE *in;

    printf("Enter word to replace: ");
    scanf("%s",oldword);

    printf("Enter new word: ");
    scanf("%s",newword);

    in=fopen("input.txt","r");
    if(in==NULL)
    {
        printf("Input file not found\n");
        return 0;
    }

    fp=fopen("output.txt","w");

    yyin=in;
    yylex();

    fclose(in);
    fclose(fp);

    printf("\nReplacement completed.\n");
    printf("Check output.txt\n");

    return 0;
}