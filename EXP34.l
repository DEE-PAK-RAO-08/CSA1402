%{
#include<stdio.h>
#include<stdlib.h>
%}

%%

[^ \t\n]+ {
    int d,m,y;

    if(sscanf(yytext,"%d/%d/%d",&d,&m,&y)==3)
    {
        /* Valid Date */
        if(d>=1 && d<=31 && m>=1 && m<=12)
        {
            /* School students (Under 18) */
            if(y>=2008)
                printf("%s : Valid DOB (Student is under 18)\n",yytext);
            else
                printf("%s : Invalid DOB (Age above 18)\n",yytext);
        }
        else
        {
            printf("%s : Invalid DOB\n",yytext);
        }
    }
    else
    {
        printf("%s : Invalid DOB Format\n",yytext);
    }
}

[ \t\n]+ ;

%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter DOB (DD/MM/YYYY):\n");
    yylex();
    return 0;
}