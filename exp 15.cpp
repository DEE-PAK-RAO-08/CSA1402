#include<stdio.h>
#include<stdlib.h>

int main()
{
    FILE *fp;
    char ch;
    int chars=0, words=0, lines=0;

    fp=fopen("input.txt","r");

    if(fp==NULL)
    {
        printf("File not found");
        return 0;
    }

    while((ch=fgetc(fp))!=EOF)
    {
        chars++;

        if(ch==' '||ch=='\n'||ch=='\t')
            words++;

        if(ch=='\n')
            lines++;
    }

    fclose(fp);

    printf("Characters = %d\n",chars);
    printf("Words = %d\n",words+1);
    printf("Lines = %d\n",lines+1);

    return 0;
}