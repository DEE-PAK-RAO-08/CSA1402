#include <stdio.h>

int main()
{
    char ch;

    printf("Enter an operator: ");
    scanf("%c", &ch);

    switch(ch)
    {
        case '+':
            printf("+ is an Addition Operator");
            break;

        case '-':
            printf("- is a Subtraction Operator");
            break;

        case '*':
            printf("* is a Multiplication Operator");
            break;

        case '/':
            printf("/ is a Division Operator");
            break;

        default:
            printf("Invalid Operator");
    }

    return 0;
}