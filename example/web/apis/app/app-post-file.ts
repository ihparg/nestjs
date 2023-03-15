import fetch from '../fetch'
export interface AppPostFileResponse
  {
    
      
      createAt: Date
      
      
      lastUpdateTime?: Date
      
  }
export interface AppPostFileBodyUser
  {
    
      
      id: string
      
       /** 年龄 */
      age?: number
      
       /** anything */
      json?: any
      
      
      decimal?: number
      
  }
export interface AppPostFileBody
  {
    
      
      file?: any
      
      
      user?: AppPostFileBodyUser
      
  }


  export default(data: AppPostFileBody): Promise < AppPostFileResponse > => fetch.post(`${process.env.HOST}/api/app/app/post-file`, data)

