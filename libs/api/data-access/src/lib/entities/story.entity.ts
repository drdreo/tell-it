import { StoryData } from "@tell-it/domain/game";
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity({ name: 'story' })
export class StoryEntity implements StoryData {
	@PrimaryGeneratedColumn()
	id: number;

	@Column('text')
	text: string;

	@Column({
		length: 50,
		nullable: true
	})
	author: string;

	@CreateDateColumn()
	created_at: Date;
}
