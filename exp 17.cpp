#include<stdio.h>

int main()
{
    printf("Grammar\n");
    printf("E -> E+T | T\n");
    printf("T -> T*F | F\n");
    printf("F -> (E) | id\n\n");

    printf("LEADING(E) = {(, id}\n");
    printf("LEADING(T) = {(, id}\n");
    printf("LEADING(F) = {(, id}\n");

    return 0;
}