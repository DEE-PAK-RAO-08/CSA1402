#include <stdio.h>

int main()
{
    printf("Original Grammar:\n");
    printf("L -> L,S | S\n\n");

    printf("Grammar after eliminating Left Recursion:\n");
    printf("L  -> SL'\n");
    printf("L' -> ,SL' | e\n");

    return 0;
}