import { IsString, IsNotEmpty, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    content: string;

    @IsOptional()
    @IsUrl()
    imageUrl?: string;
}
