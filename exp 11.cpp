#include <stdio.h>

struct symbol
{
    char name[20];
    char type[20];
};

int main()
{
    struct symbol s[10];
    int n, i;

    printf("Enter number of symbols: ");
    scanf("%d", &n);

    for(i=0;i<n;i++)
    {
        printf("Enter Symbol Name: ");
        scanf("%s", s[i].name);

        printf("Enter Data Type: ");
        scanf("%s", s[i].type);
    }

    printf("\nSymbol Table\n");
    printf("------------\n");

    for(i=0;i<n;i++)
    {
        printf("%s\t%s\n", s[i].name, s[i].type);
    }

    return 0;
}