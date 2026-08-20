#include <stdio.h>
#include <string.h>

int main()
{
    char str[200];

    printf("Enter a line:\n");
    fgets(str, sizeof(str), stdin);

    if(strncmp(str, "//", 2) == 0)
    {
        printf("It is a Single Line Comment.\n");
    }
    else if(strncmp(str, "/*", 2) == 0)
    {
        if(strstr(str, "*/") != NULL)
            printf("It is a Multi Line Comment.\n");
        else
            printf("Multi Line Comment is not closed.\n");
    }
    else
    {
        printf("It is NOT a Comment.\n");
    }

    return 0;
}