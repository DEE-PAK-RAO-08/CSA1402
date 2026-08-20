#include <stdio.h>
#include <ctype.h>

int main()
{
    char id[100];
    int i = 1, valid = 1;

    printf("Enter Identifier: ");
    scanf("%s", id);

    if(!(isalpha(id[0]) || id[0] == '_'))
        valid = 0;

    while(id[i] != '\0')
    {
        if(!(isalnum(id[i]) || id[i] == '_'))
        {
            valid = 0;
            break;
        }
        i++;
    }

    if(valid)
        printf("Valid Identifier");
    else
        printf("Invalid Identifier");

    return 0;
}