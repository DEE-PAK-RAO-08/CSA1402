#include<stdio.h>

int main()
{
    printf("Intermediate Code : a = b + c\n\n");

    printf("Target Code\n");
    printf("MOV R1,b\n");
    printf("ADD R1,c\n");
    printf("MOV a,R1\n");

    return 0;
}