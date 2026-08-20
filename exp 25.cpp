#include <stdio.h>

int main()
{
    char ch;
    int spaces = 0, lines = 0;

    printf("Enter text (Press Ctrl+Z to stop):\n");

    while((ch = getchar()) != EOF)
    {
        if(ch == ' ')
            spaces++;

        if(ch == '\n')
            lines++;
    }

    printf("\nNumber of Spaces = %d", spaces);
    printf("\nNumber of New Lines = %d", lines);

    return 0;
}