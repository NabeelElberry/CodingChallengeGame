export interface SelectButtonProps {
    children: React.ReactNode;
    buttonChosen: number;
    small?: boolean;
    onClick?: () => {};
}

export interface FirebaseJwtPayload {
iss: string;
aud: string;
auth_time: number;
user_id: string;   // <— this is the Firebase‐assigned UID
sub: string;       // often same as user_id
iat: number;
exp: number;
email?: string;
name?: string;
// any other custom claims you’ve set
}

export interface MatchResponse {
    initiator: boolean;
    matchDto: {
    user1: string;
    user2: string;
    winner: number | null;
    };
}