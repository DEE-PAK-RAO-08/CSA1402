#include<stdio.h>

int main()
{
    printf("Grammar\n");
    printf("E -> E+T | T\n");
    printf("T -> T*F | F\n");
    printf("F -> (E) | id\n\n");

    printf("TRAILING(E) = {), id}\n");
    printf("TRAILING(T) = {), id}\n");
    printf("TRAILING(F) = {), id}\n");

    return 0;
}