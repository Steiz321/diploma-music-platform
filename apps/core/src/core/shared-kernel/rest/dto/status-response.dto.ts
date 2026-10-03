import {ApiProperty} from '@nestjs/swagger';

export class StatusResponse {
  @ApiProperty()
  status: boolean;

  public static ok(): StatusResponse {
    const model = new StatusResponse();
    model.status = true;
    return model;
  }

  public static fail(): StatusResponse {
    const model = new StatusResponse();
    model.status = false;
    return model;
  }
}
