// SPDX-License-Identifier: MIT
pragma solidity < 0.9.0;

import "./CurveBabyJubJub.sol";

contract VerifySigmaProtocol {
    // two base
    uint256[2] private g = [0x171e826ad4a870fd925e0bf0e87884e70e080879c2205ef10114f28a3b6f6dd7,
    0x2bd407d897fbbca9f88adfd2d15252e69de8c1564eb4d3d27162e259172f1a1d];
    uint256[2] private h = [0x5e8290bfaba1ccfad33259a92884cc00644d5fb019ca4dcbdb50123ab32aaf1,
    0x5e352269c07449ea6667d7608c648894125d94e751b1b46a9cf56bbb02f3766];

     function pointAdd(uint256[2] memory point1, uint256[2] memory point2)
        public view returns (uint256[2] memory result) {
        bytes memory data = abi.encodePacked(point1[0], point1[1], point2[0], point2[1]);
        (bool success, bytes memory returnData) = address(0x06).staticcall(data);
        require(success && returnData.length >= 64, "Point addition failed");
        result[0] = _toUint256(returnData, 0);
        result[1] = _toUint256(returnData, 32);
    }

    function pointMul(uint256[2] memory point, uint256 scalar)
        public view returns (uint256[2] memory result) {
        bytes memory data = abi.encodePacked(point[0], point[1], scalar);
        (bool success, bytes memory returnData) = address(0x07).staticcall(data);
        require(success && returnData.length >= 64, "Scalar multiplication failed");
        result[0] = _toUint256(returnData, 0);
        result[1] = _toUint256(returnData, 32);
    }

    function test() public view returns (uint256 x) {
        bytes32 hash = keccak256(abi.encodePacked("07540a0172fce1b7b04c5f841d9aadd2a05219403205efdc1d896ae2072ac62416317acea5734f30ac74dc8bc0a3e88a61d547b6e450db280010773928efbff51415e216f4134b0cd22f42b4071c998d6385047be239c3c9e2b1bf63afca04402371bbc6ebd9554550efa099fdc4108b7f4744febdaff2bfae5274b5742b70bb1415e216f4134b0cd22f42b4071c998d6385047be239c3c9e2b1bf63afca04402e7c6f45a38b24e89d8e12948fa32a5d76e4d61b52c2109a839645823a5e70be1c91f5bbb274c296594f38b9afda1a97c4a752d90e9a0fb87d41cc65e5072c25200ce8b4f56869be899eddba5733abe8674c3aa021bbf9fd4b15423fc195bbb81415e216f4134b0cd22f42b4071c998d6385047be239c3c9e2b1bf63afca04401205025075a21991e99359a5571bfea884895d1155b86f2ab9021fd5f0c639a4303c2f858ce646aeee20cee0b6708a6f49403594b40067d8d59d48d992b275a9"));
        x = uint256(hash);
    }

    function sigmaProofOfValueVerifier(uint256[][2] memory A, uint256[][2] memory B, 
    uint256[] memory zList_1, uint256[] memory zList_2,
    uint256[2] memory upk, uint256[][2] memory XList, uint256[][2] memory YList) 
    public view returns (bool result) {
        require(
            A.length == B.length && A.length == zList_1.length && A.length == zList_2.length 
            && A.length == XList.length && A.length == YList.length,
            "Invalid input length, A, B, zList_1, zList_2, XList, YList should have the same length"
        );

        require(
            A.length > 0,
            "Invalid input length, A, B, zList_1, zList_2, XList, YList should have length > 0"
        );

        uint256 hashInput = sumArray(A)+sumArray(B);
        string memory hashInputStr = uint2str(hashInput);
        bytes32 hash = keccak256(abi.encodePacked(hashInputStr));
        uint256 e = uint256(hash);

        for(uint256 i = 0; i < A.length; i++) {
            validResponse1(zList_1[i],
            XList[i], A[i], upk, e);
            validResponse2(zList_1[i], zList_2[i],
            YList[i], B[i], e);
        }

        result = true;
    }

    //function sigmaProofOfKeyVerifier(uint256[][2] memory A, uint256[][2] memory B,
    //uint256[] memory zList_1, uint256[] memory zList_2,
    //uint256[2] memory upk, uint256[][2] memory XList, uint256[][2] memory YList)


    function sumArray(uint256[][2] memory array) internal pure returns (uint256 sum) {
        for (uint256 i = 0; i < array.length; i++) {
            sum += array[i][0];
        }
    }

    function validResponse1(uint256 z_1,
    uint256[] memory X, uint256[] memory A,
    uint256[2] memory upk, uint256 e) private view{
        uint256[2] memory upkz_1;
        // (upkz_1[0], upkz_1[1]) = CurveBabyJubJub.pointMul(upk[0], upk[1], z_1);
        uint256[2] memory mediPoint_1;
        // (mediPoint_1[0], mediPoint_1[1]) = CurveBabyJubJub.pointMul(X[0], X[1], e);
        uint256[2] memory AXe;
        // (AXe[0], AXe[1]) = CurveBabyJubJub.pointAdd(A[0], A[1], mediPoint_1[0], mediPoint_1[1]);
        compareArray(upkz_1, AXe);
    }

    function validResponse2(uint256 z_1, uint256 z_2, 
    uint256[] memory Y, uint256[] memory B,
    uint256 e) internal view{
        uint256[2] memory mediPoint_1;
        // (mediPoint_1[0], mediPoint_1[1]) = CurveBabyJubJub.pointMul(g[0], g[1], z_1);
        uint256[2] memory mediPoint_2;
        // (mediPoint_2[0], mediPoint_2[1]) = CurveBabyJubJub.pointMul(h[0], h[1], z_2);
        uint256[2] memory gz_1hz_2;
        // (gz_1hz_2[0], gz_1hz_2[1]) = CurveBabyJubJub.pointAdd(mediPoint_1[0], mediPoint_1[1], mediPoint_2[0], mediPoint_2[1]);
        // (mediPoint_1[0], mediPoint_1[1]) = CurveBabyJubJub.pointMul(Y[0], Y[1], e);
        uint256[2] memory BYe;
        // (BYe[0], BYe[1]) = CurveBabyJubJub.pointAdd(B[0], B[1], mediPoint_1[0], mediPoint_1[1]);
        compareArray(gz_1hz_2, BYe);
    }

    function compareArray(uint256[2] memory array1, uint256[2] memory array2) internal pure {
        if (array1.length != array2.length) {
            revert("valid failed, array length not equal");
        } else {
            for (uint256 i = 0; i < array1.length; i++) {
                if (array1[i] != array2[i]) {
                    revert("valid failed!");
                }
            }
        }
    }

    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // Private helper function to convert bytes to a uint256
    function _toUint256(bytes memory data, uint256 start) private pure returns (uint256) {
        require(data.length >= start + 32, "Invalid data length");
        uint256 result;
        assembly {
            result := mload(add(data, add(0x20, start)))
        }
        return result;
    }

}