#include<stdio.h>
#include<string.h>

int main()
{
    char a,b,c,d;

    printf("Enter expression (Example: a=b+c*d): ");
    scanf("%c=%c+%c*%c",&a,&b,&c,&d);

    printf("\nThree Address Code\n");
    printf("T1 = %c * %c\n",c,d);
    printf("T2 = %c + T1\n",b);
    printf("%c = T2\n",a);

    return 0;
}