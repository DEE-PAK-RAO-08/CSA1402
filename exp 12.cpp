#include<stdio.h>
#include<string.h>

char str[20];
int i=0;

void E();
void EP();
void T();
void TP();
void F();

void E()
{
    T();
    EP();
}

void EP()
{
    if(str[i]=='+')
    {
        i++;
        T();
        EP();
    }
}

void T()
{
    F();
    TP();
}

void TP()
{
    if(str[i]=='*')
    {
        i++;
        F();
        TP();
    }
}

void F()
{
    if(str[i]=='i')
        i++;
    else if(str[i]=='(')
    {
        i++;
        E();
        if(str[i]==')')
            i++;
    }
}

int main()
{
    printf("Enter Expression: ");
    scanf("%s",str);

    E();

    if(str[i]=='\0')
        printf("String Accepted");
    else
        printf("String Rejected");

    return 0;
}