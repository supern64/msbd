/*
    constants required for the MSBD protocol
*/

export const DW_SIGNATURE = 0x2042534D
export const W_VERSION = 0x0106

export enum Message {
    REQ_PING        = 0x0001, // MSB_MSG_REQ_PING
    RES_PING        = 0x0002, // MSB_MSG_RES_PING
    REQ_STREAMINFO  = 0x0003, // MSB_MSG_REQ_STREAMINFO
    RES_STREAMINFO  = 0x0004, // MSB_MSG_RES_STREAMINFO
    IND_STREAMINFO  = 0x0005, // MSB_MSG_IND_STREAMINFO
    REQ_CONNECT     = 0x0007, // MSB_MSG_REQ_CONNECT
    RES_CONNECT     = 0x0008, // MSB_MSG_RES_CONNECT
    IND_EOS         = 0x0009, // MSB_MSG_IND_EOS
    IND_PACKET      = 0x000A  // MSB_MSG_IND_PACKET
}

export enum REQ_CONNECTION_FLAGS {
    MULTIPLE_CLIENT = 2,
    SINGLE_CLIENT   = 1
}

export enum RES_CONNECTION_FLAGS {
    ASF_NOT_IN_NSC  = 0,
    ASF_IN_NSC      = 2
}

export enum SIN_FAMILY {
    NON_MULTICAST   = 0,
    MULTICAST       = 2
}