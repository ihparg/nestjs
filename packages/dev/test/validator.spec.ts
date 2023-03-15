import { ValidationPipe } from '../src/dev/validator'
import { SaveResponse } from './user'

describe('AppController (e2e)', () => {
  it('validate user', async () => {
    const vp = new ValidationPipe()
    const entry = {
      id: '2',
      uid: '111',
      name: 'Button',
      alias: 'Button',
      displayName: '按钮',
      startVersion: '0.0.1',
      endVersion: '',
      import: {
        default: true,
        path: 'shineout',
      },
      package: 'shineout',
      preProps: {},
      tag: 'Shineout 交互',
      props: {
        type: {
          type: ['string'],
        },
      },
      createTime: new Date(),
      lastUpdateTime: new Date(),
      hehe: 'hehe',
    }
    const res = await vp.transform(entry, { metatype: SaveResponse } as any)
    console.log(res)

    expect(entry).toEqual(res)
  })
})
