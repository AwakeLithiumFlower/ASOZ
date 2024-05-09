// SPDX-License-Identifier: MIT
pragma solidity < 0.9.0;

import "./CurveBabyJubJub.sol";

contract VerifySigmaProtocol {
    // two base
    uint256[2] private g = [0x171e826ad4a870fd925e0bf0e87884e70e080879c2205ef10114f28a3b6f6dd7,
    0x2bd407d897fbbca9f88adfd2d15252e69de8c1564eb4d3d27162e259172f1a1d];
    uint256[2] private h = [0x5e8290bfaba1ccfad33259a92884cc00644d5fb019ca4dcbdb50123ab32aaf1,
    0x5e352269c07449ea6667d7608c648894125d94e751b1b46a9cf56bbb02f3766];

    function pointAdd(uint256 _x1, uint256 _y1, uint256 _x2, uint256 _y2) public view returns (uint256 x3, uint256 y3) {
        (x3, y3) = CurveBabyJubJub.pointAdd(_x1, _y1, _x2, _y2);
    }

    function pointMul(uint256 _x1, uint256 _y1, uint256 _d) public view returns (uint256 x2, uint256 y2) {
        (x2, y2) = CurveBabyJubJub.pointMul(_x1, _y1, _d);
    }

    function pointDouble(uint256 _x1, uint256 _y1) public view returns (uint256 x2, uint256 y2) {
        (x2, y2) = CurveBabyJubJub.pointDouble(_x1, _y1);
    }

    // function test() public view returns (uint256 x) {
    //     bytes32 hash = keccak256(abi.encodePacked("14160185613158107798945126702461707263750732592693844435344327640031183275191"));
    //     x = uint256(hash);
    // }

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

        for(uint8 i = 0; i < A.length; i++) {
            validResponse1(zList_1[i],
            XList[i], A[i], upk, e);
            validResponse2(zList_1[i], zList_2[i],
            YList[i], B[i], e);
        }

        result = true;
    }

    function sumArray(uint256[][2] memory array) internal pure returns (uint256 sum) {
        for (uint8 i = 0; i < array.length; i++) {
            sum += array[i][0];
        }
    }

    function validResponse1(uint256 z_1,
    uint256[] memory X, uint256[] memory A,
    uint256[2] memory upk, uint256 e) private view{
        uint256[2] memory upkz_1;
        (upkz_1[0], upkz_1[1]) = CurveBabyJubJub.pointMul(upk[0], upk[1], z_1);
        uint256[2] memory mediPoint_1;
        (mediPoint_1[0], mediPoint_1[1]) = CurveBabyJubJub.pointMul(X[0], X[1], e);
        uint256[2] memory AXe;
        (AXe[0], AXe[1]) = CurveBabyJubJub.pointAdd(A[0], A[1], mediPoint_1[0], mediPoint_1[1]);
        compareArray(upkz_1, AXe);
    }

    function validResponse2(uint256 z_1, uint256 z_2, 
    uint256[] memory Y, uint256[] memory B,
    uint256 e) internal view{
        uint256[2] memory mediPoint_1;
        (mediPoint_1[0], mediPoint_1[1]) = CurveBabyJubJub.pointMul(g[0], g[1], z_1);
        uint256[2] memory mediPoint_2;
        (mediPoint_2[0], mediPoint_2[1]) = CurveBabyJubJub.pointMul(h[0], h[1], z_2);
        uint256[2] memory gz_1hz_2;
        (gz_1hz_2[0], gz_1hz_2[1]) = CurveBabyJubJub.pointAdd(mediPoint_1[0], mediPoint_1[1], mediPoint_2[0], mediPoint_2[1]);
        (mediPoint_1[0], mediPoint_1[1]) = CurveBabyJubJub.pointMul(Y[0], Y[1], e);
        uint256[2] memory BYe;
        (BYe[0], BYe[1]) = CurveBabyJubJub.pointAdd(B[0], B[1], mediPoint_1[0], mediPoint_1[1]);
        compareArray(gz_1hz_2, BYe);
    }

    function compareArray(uint256[2] memory array1, uint256[2] memory array2) internal pure {
        if (array1.length != array2.length) {
            revert("valid failed, array length not equal");
        } else {
            for (uint8 i = 0; i < array1.length; i++) {
                if (array1[i] != array2[i]) {
                    revert(uint2str(array1[i]));
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

}