#include <stdio.h>

int main()
{
    printf("Grammar:\n");
    printf("S -> AaAb | BbBa\n");
    printf("A -> e\n");
    printf("B -> e\n\n");

    printf("FOLLOW(S) = { $ }\n");
    printf("FOLLOW(A) = { a, b }\n");
    printf("FOLLOW(B) = { b, a }\n");

    return 0;
}