%{
#include <stdio.h>

int consonants = 0;
%}

%%
[a-zA-Z] {
    char ch = yytext[0];

    if(ch!='a' && ch!='e' && ch!='i' && ch!='o' && ch!='u' &&
       ch!='A' && ch!='E' && ch!='I' && ch!='O' && ch!='U')
    {
        consonants++;
    }
}

.      ;
\n     { return 0; }

%%

int yywrap()
{
    return 1;
}

int main()
{
    printf("Enter a sentence: ");
    yylex();

    printf("\nNumber of consonants = %d\n", consonants);

    return 0;
}