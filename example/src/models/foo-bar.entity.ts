

/** 由 @graphi/nestjs/model.generator.ts 生成，不要手动修改 */
import { Entity, Column, Index, ManyToOne,JoinColumn } from 'typeorm'
import { PingPong } from './ping-pong.entity'


@Entity('foo_bar')
export class FooBar {
  
  
  
  @Column({"type":"datetime","default":() => 'CURRENT_TIMESTAMP',"name":"create_at"})
  
  @Index("idx_create_at", { unique: false })
  createAt: Date
  
  
  @Column({"type":"datetime","default":() => 'CURRENT_TIMESTAMP',"onUpdate":"CURRENT_TIMESTAMP","name":"last_update_time"})
  
  @Index("idx_last_update_time", { unique: false })
  lastUpdateTime?: Date
  
  
  
  @ManyToOne(() => PingPong, (e: PingPong) => e.foobarList, { createForeignKeyConstraints: false })
@JoinColumn({ name: 'ping_pong_id' })
  
  pingPong?: PingPong
  
}