pragma solidity >=0.8.0 <0.9.0;

contract BN128Operations {
    // Function to perform point addition on the bn128 curve with gas measurement
    function pointAdditionWithGasCost(uint256[2] memory point1, uint256[2] memory point2)
        public view returns (string memory result, uint256 gasCost) {

        uint256 gasStart = gasleft();
        bytes memory data = abi.encodePacked(point1[0], point1[1], point2[0], point2[1]);

        (bool success, bytes memory returnData) = address(0x06).staticcall(data);
        uint256 gasEnd = gasleft();

        require(success, "Point addition failed");

        result = _toHexString(returnData);
        gasCost = gasStart - gasEnd; // Calculate the gas cost
    }

    // Function to perform scalar multiplication on the bn128 curve with gas measurement
    function scalarMultiplicationWithGasCost(uint256[2] memory point, uint256 scalar)
        public view returns (string memory result, uint256 gasCost) {

        uint256 gasStart = gasleft();
        bytes memory data = abi.encodePacked(point[0], point[1], scalar);

        (bool success, bytes memory returnData) = address(0x07).staticcall(data);
        uint256 gasEnd = gasleft();

        require(success, "Scalar multiplication failed");

        result = _toHexString(returnData);
        gasCost = gasStart - gasEnd; // Calculate the gas cost
    }

    // Private helper function to convert bytes to a hex string
    function _toHexString(bytes memory data) private pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}