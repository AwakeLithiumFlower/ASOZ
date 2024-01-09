import matplotlib.pyplot as plt
import numpy as np

plt.rcParams.update({'font.size': 14})
plt.tight_layout()  # 添加这一行来自动调整布局

# witness_data = [7.383, 11.629, 15.855, 20.480, 26.075, 30.502]
# valid_proof_data = [0.298, 0.587, 1.011, 1.227, 1.835, 1.898]
# generate_sigma_proof_data = [0.111, 0.177, 0.254, 0.317, 0.386, 0.465]
# verify_sigma_proof_data = [0.264, 0.450, 0.651, 0.841, 1.041, 1.251]
# # unit byte
# sigma_proof_size_data = [4.573, 7.364, 10.210, 13.065, 15.859, 18.739]


proof_part2_data = [2265, 2321, 2345, 2492, 2953, 3272]
proof_part2_orign_data = [1892, 2359, 2422, 2432, 2322, 2703]
verify_part_data = [984, 987, 1094, 1171, 1078, 1224]
verify_part_orign_data = [1017, 1172, 1000, 1024, 1032, 1203]
generate_proof_part1_data = [7.677, 9.955, 11.632, 14.141, 15.740, 17.847]
generate_sigma_proof_data = [0.103448, 0.117812, 0.14564, 0.179615, 0.212844, 0.237328]
sigma_proof_size_data = [1616, 2233, 2852, 3469, 4075, 4696]
cmsnList_size_data = [324, 487, 646, 805, 970, 1133]
zkSNARK_proof_size_data = [803, 806, 803, 801, 806, 807]
verify_sigma_proof_data = [0.376732, 0.499119, 0.609232, 0.753592, 0.879517, 1.016]
generate_proof_part1_without_audit_data = [7.193, 8.694, 9.383, 10.740, 12.176, 13.525]
zkSNARK_witness_size_data = [546, 693, 841, 989, 1137, 1284]  # kb
zkSNARK_witness_size_orign_data = [496, 595, 693, 792, 890, 989]  # kb

proof_part2_data = [i / 1000 for i in proof_part2_data]
proof_part2_orign_data = [i / 1000 for i in proof_part2_orign_data]
verify_part_data = [i / 1000 for i in verify_part_data]
verify_part_orign_data = [i / 1000 for i in verify_part_orign_data]
sigma_proof_size_data = [i / 1024 for i in sigma_proof_size_data]
zkSNARK_proof_size_data = [i / 1024 for i in zkSNARK_proof_size_data]
cmsnList_size_data = [i / 1024 for i in cmsnList_size_data]

generate_proof_time_orign = [i + j for i, j in zip(generate_proof_part1_without_audit_data, proof_part2_orign_data)]
generate_proof_time = [i + j + k for i, j, k in zip(generate_proof_part1_data, proof_part2_data, generate_sigma_proof_data)]
verify_proof_time_orign = verify_part_orign_data
verify_proof_time = [i + j for i, j in zip(verify_part_data, verify_sigma_proof_data)]
transmission_overhead_orign = [i + j for i, j in zip(zkSNARK_proof_size_data, cmsnList_size_data)]
transmission_overhead = sigma_proof_size_data
storage_cost_orign = [i + j for i, j in zip(zkSNARK_witness_size_orign_data, zkSNARK_proof_size_data)]
storage_cost = [i + j for i, j in zip(zkSNARK_witness_size_data, sigma_proof_size_data)]

print((generate_proof_time[0] - generate_proof_time_orign[0])/generate_proof_time_orign[0])
print((verify_proof_time[0] - verify_proof_time_orign[0])/verify_proof_time_orign[0])
print((storage_cost[0] - storage_cost_orign[0])/storage_cost_orign[0])
print((transmission_overhead[0] - transmission_overhead_orign[0])/transmission_overhead_orign[0])
print(transmission_overhead)
print(transmission_overhead_orign)

ind = np.arange(len(generate_proof_time_orign))
width = 0.35

fig, ax = plt.subplots()

rects1 = ax.bar(ind - width/2, verify_proof_time_orign, width, label='Original scheme')
rects2 = ax.bar(ind + width/2, verify_proof_time, width, label='Introducing regulation')

ax.set_ylabel('Time (s)')
# ax.set_title('Comparison of Verify Time')
ax.set_xticks(ind)
ax.set_xticklabels(('1-1', '1-2', '1-3', '1-4', '1-5', '1-6'))
ax.legend()

fig.savefig('verify_time_comparison.png')

fig1, ax1 = plt.subplots()

rects1 = ax1.bar(ind - width/2, generate_proof_time_orign, width, label='Original scheme')
rects2 = ax1.bar(ind + width/2, generate_proof_time, width, label='Introducing regulation')

ax1.set_ylabel('Time (s)')
# ax1.set_title('Comparison of Proof Generating Time')
ax1.set_xticks(ind)
ax1.set_xticklabels(('1-1', '1-2', '1-3', '1-4', '1-5', '1-6'))
ax1.legend()

fig1.savefig('generate_proof_time_comparison.png')

fig2, ax2 = plt.subplots()

rects3 = ax2.bar(ind - width/2, transmission_overhead_orign, width, label='Original scheme')
rects4 = ax2.bar(ind + width/2, transmission_overhead, width, label='Introducing regulation')

ax2.set_ylabel('Size (KB)')
# ax2.set_title('Transmission Overhead')
ax2.set_xticks(ind)
ax2.set_xticklabels(('1-1', '1-2', '1-3', '1-4', '1-5', '1-6'))
ax2.legend()

fig2.savefig('transmission_overhead.png')


# fig2, ax2 = plt.subplots()

# rects3 = ax2.bar(ind - width/2, storage_cost_orign, width, label='Original scheme')
# rects4 = ax2.bar(ind + width/2, storage_cost, width, label='Introducing regulation')

# ax2.set_ylabel('Size (KB)')
# # ax2.set_title('Transmission Overhead')
# ax2.set_xticks(ind)
# ax2.set_xticklabels(('1-1', '1-2', '1-3', '1-4', '1-5', '1-6'))
# ax2.legend()

# fig2.savefig('storage_cost.png')
