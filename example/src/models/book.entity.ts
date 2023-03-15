

/** 由 @graphi/nestjs/model.generator.ts 生成，不要手动修改 */
import { Entity, Column ,PrimaryGeneratedColumn, Index } from 'typeorm'
import { BugType } from '../interface'


@Entity('book')
export class Book {
  
  /** 主键 */
  @PrimaryGeneratedColumn({"type":"bigint","name":"id"})
  id: string
  
  
  
  @Column({"type":"datetime","default":() => 'CURRENT_TIMESTAMP',"name":"create_time"})
  
  @Index("idx_create_time", { unique: false })
  createTime: Date
  
  
  @Column({"type":"varchar","default":"","length":"4000","name":"long"})
  
  
  long: string
  
  /** mvp */
  @Column({"type":"varchar","default":"","name":"name","unique":true})
  
  @Index("uk_name", { unique: true })
  name: string
  
  
  @Column({"type":"varchar","default":"0","name":"type"})
  
  
  type?: "0"|"1"|"2"
  
}