import matplotlib.pyplot as plt

witness_data = [7.383, 11.629, 15.855, 20.480, 26.075, 30.502]
valid_proof_data = [0.298, 0.587, 1.011, 1.227, 1.835, 1.898]
x = range(1, len(witness_data) + 1)
x_labels = ['1-1', '2-2', '3-3', '4-4', '5-5', '6-6']

fig, axs = plt.subplots(1, 2, figsize=(10, 5))

axs[0].plot(x, witness_data, marker='o', linestyle='-', color='r', label='Witness')
axs[0].set_xlabel('Input-Output transaction')
axs[0].set_ylabel('Time (s)')
axs[0].set_xticks(x)
axs[0].set_xticklabels(x_labels)
axs[0].legend()
axs[0].grid(True)

axs[1].plot(x, valid_proof_data, marker='o', linestyle='-', color='b', label='Valid Proof on zk-SNARK')
axs[1].set_xlabel('Input-Output transaction')
axs[1].set_ylabel('Time (s)')
axs[1].set_xticks(x)
axs[1].set_xticklabels(x_labels)
axs[1].legend()
axs[1].grid(True)

plt.tight_layout()

plt.savefig('charts.png')

plt.show()