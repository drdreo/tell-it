import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTellItDB1669146694911 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE DATABASE tellit`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP DATABASE tellit`);
    }
}
