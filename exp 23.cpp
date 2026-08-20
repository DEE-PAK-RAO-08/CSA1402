#include <stdio.h>
#include <ctype.h>

int main()
{
    char ch;

    printf("Enter the program (Press Ctrl+Z on Windows or Ctrl+D on Linux to end):\n");

    while ((ch = getchar()) != EOF)
    {
        /* Ignore spaces, tabs and new lines */
        if (ch == ' ' || ch == '\t' || ch == '\n')
            continue;

        /* Ignore single line comments */
        if (ch == '/')
        {
            char next = getchar();

            if (next == '/')
            {
                while ((ch = getchar()) != '\n' && ch != EOF);
                continue;
            }
            else if (next == '*')
            {
                char prev = 0;
                while ((ch = getchar()) != EOF)
                {
                    if (prev == '*' && ch == '/')
                        break;
                    prev = ch;
                }
                continue;
            }
            else
            {
                putchar('/');
                putchar(next);
            }
        }
        else
        {
            putchar(ch);
        }
    }

    return 0;
}