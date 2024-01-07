import matplotlib.pyplot as plt
import numpy as np

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
generate_proof_part1_data = [8.577, 10.423, 12.016, 13.616, 15.703, 17.517]
generate_sigma_proof_data = [0.159555, 0.203109, 0.260509, 0.308092, 0.361381, 0.41219]
sigma_proof_size_data = [6508, 8261, 10008, 11742, 13528, 15263]
zkSNARK_proof_size_data = [803, 806, 803, 801, 806, 807]
verify_sigma_proof_data = [0.371197, 0.490657, 0.614919, 0.726761, 0.844425, 0.955901]
generate_proof_part1_without_audit_data = [7.193, 8.694, 9.383, 10.740, 12.176, 13.525]


proof_part2_data = [i / 1000 for i in proof_part2_data]
proof_part2_orign_data = [i / 1000 for i in proof_part2_orign_data]
verify_part_data = [i / 1000 for i in verify_part_data]
verify_part_orign_data = [i / 1000 for i in verify_part_orign_data]
sigma_proof_size_data = [i / 1024 for i in sigma_proof_size_data]
zkSNARK_proof_size_data = [i / 1024 for i in zkSNARK_proof_size_data]

generate_proof_time_orign = [i + j for i, j in zip(generate_proof_part1_without_audit_data, proof_part2_orign_data)]
generate_proof_time = [i + j + k for i, j, k in zip(generate_proof_part1_data, proof_part2_data, generate_sigma_proof_data)]
verify_proof_time_orign = verify_part_orign_data
verify_proof_time = [i + j for i, j in zip(verify_part_data, verify_sigma_proof_data)]
transmission_overhead_orign = zkSNARK_proof_size_data
transmission_overhead = sigma_proof_size_data

print((generate_proof_time[0] - generate_proof_time_orign[0])/generate_proof_time_orign[0])
print((verify_proof_time[0] - verify_proof_time_orign[0])/verify_proof_time_orign[0])

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

rects3 = ax2.bar(ind, transmission_overhead, width, label='Sigma Proof Size')

ax2.set_ylabel('Size (KB)')
# ax2.set_title('Transmission Overhead')
ax2.set_xticks(ind)
ax2.set_xticklabels(('1-1', '1-2', '1-3', '1-4', '1-5', '1-6'))
ax2.legend()

fig2.savefig('transmission_overhead.png')
