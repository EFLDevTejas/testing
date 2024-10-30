module.exports = (sequelize, DataTypes) => {
    const DownloadKFSDetails = sequelize.define(
        'DownloadKFSDetails',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            application_number: {
                type: DataTypes.STRING,
                allowNull: false
            },
            type_of_loan: {
                type: DataTypes.STRING,
            },
            finance_amount: {
                type: DataTypes.FLOAT,
            },
            tenure: {
                type: DataTypes.INTEGER,
            },
            loan_terms: {
                type: DataTypes.STRING,
            },
            first_installment_date: {
                type: DataTypes.STRING,
            },
            effective_interest_rate: {
                type: DataTypes.FLOAT,
            },
            rate_type: {
                type: DataTypes.STRING,
            },
            sanction_amount: {
                type: DataTypes.FLOAT,
            },
            total_interest_amount: {
                type: DataTypes.FLOAT,
            },
            toatl_amount_paid_by_borrower: {
                type: DataTypes.FLOAT,
            },
            loan_disbursal_status: {
                type: DataTypes.STRING,
            },
            vertical: {
                type: DataTypes.STRING,
            },
            moratorium_in_month: {
                type: DataTypes.INTEGER,
            },
            description: {
                type: DataTypes.TEXT,
            },
            language: {
                type: DataTypes.STRING,
            },
            user_employeeCode: {
                type: DataTypes.STRING,
            },
            ip_address: {
                type: DataTypes.STRING,
            },
            s3_bucket_url : {
                type: DataTypes.TEXT,
            }
        },
        {
            tableName: 'download_kfs_details',
            timestamps: true,
            paranoid: true,
            underscored: true
        }
    );

    return DownloadKFSDetails;
}