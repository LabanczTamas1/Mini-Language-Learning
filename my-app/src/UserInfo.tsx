import React from 'react';

interface UserInfoProps {
  userId: string;
  email: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ userId, email }) => {
  return (
    <div>
      <h2>Welcome, {email}!</h2>
      <p>You are logged in as user ID: {userId}</p>
    </div>
  );
};

export default UserInfo;
