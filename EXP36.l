%{
#include<stdio.h>

int a, b;
%}

%%

[0-9]+[+][0-9]+ {
    sscanf(yytext,"%d+%d",&a,&b);
    printf("Addition = %d\n",a+b);
}

[0-9]+[-][0-9]+ {
    sscanf(yytext,"%d-%d",&a,&b);
    printf("Subtraction = %d\n",a-b);
}

[0-9]+[*][0-9]+ {
    sscanf(yytext,"%d*%d",&a,&b);
    printf("Multiplication = %d\n",a*b);
}

[0-9]+[/][0-9]+ {
    sscanf(yytext,"%d/%d",&a,&b);
    if(b==0)
        printf("Division by zero is not possible\n");
    else
        printf("Division = %d\n",a/b);
}

[ \t\n]+ ;

. {
    printf("Invalid Expression\n");
}

%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter Expression (Example: 10+20):\n");
    yylex();
    return 0;
}