import fetch from '../fetch'
export interface GetUserResponseObject
  {
    
      
      firstName?: string
      
      
      lastName?: string
      
  }
export interface GetUserResponse
  {
    
      
      id: string
      
       /** 年龄 */
      age?: number
      
       /** anything */
      json?: any
      
      
      decimal?: number
      
      
      object?: GetUserResponseObject
      
      
      map?: { [key:string]: string }
      
  }


  export default(): Promise < GetUserResponse > => fetch.get('${process.env.HOST}/api/userInfo/getUser')
