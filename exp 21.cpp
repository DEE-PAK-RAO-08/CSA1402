#include <stdio.h>
#include <ctype.h>
#include <string.h>

int isKeyword(char str[])
{
    char *keywords[] = {
        "int","float","char","if","else","while","for",
        "return","void","double","break","continue"
    };

    int n = sizeof(keywords) / sizeof(keywords[0]);

    for(int i = 0; i < n; i++)
    {
        if(strcmp(str, keywords[i]) == 0)
            return 1;
    }
    return 0;
}

int main()
{
    char str[1000];
    int i = 0;

    printf("Enter C statement:\n");
    fgets(str, sizeof(str), stdin);

    while(str[i] != '\0')
    {
        if(isspace(str[i]))
        {
            i++;
            continue;
        }

        if(isalpha(str[i]) || str[i] == '_')
        {
            char token[50];
            int j = 0;

            while(isalnum(str[i]) || str[i] == '_')
            {
                token[j++] = str[i++];
            }

            token[j] = '\0';

            if(isKeyword(token))
                printf("%s --> Keyword\n", token);
            else
                printf("%s --> Identifier\n", token);
        }

        else if(isdigit(str[i]))
        {
            char num[50];
            int j = 0;

            while(isdigit(str[i]))
            {
                num[j++] = str[i++];
            }

            num[j] = '\0';
            printf("%s --> Constant\n", num);
        }

        else if(strchr("+-*/=%<>", str[i]))
        {
            printf("%c --> Operator\n", str[i]);
            i++;
        }

        else
        {
            i++;
        }
    }

    return 0;
}